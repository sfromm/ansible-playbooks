<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns="http://www.w3.org/1999/xhtml">

  <!-- Append alt text -->
  <xsl:template match="xhtml:img">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
      <br />
      <span class="alttextwrapper" onclick="$('.alttext', this).toggle()">
        Alt text<span class="alttext" style="display: none">:
          <xsl:value-of select="@alt"/>
        </span>
      </span>
    </xsl:copy>
  </xsl:template>

  <!-- pass through everything else -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
