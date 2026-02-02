<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProductDetail.aspx.cs" Inherits="ERP.SiteNC202310.ProductDetail" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <%--<link rel="stylesheet" href="layui/css/layui.css" />--%>
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
   <%-- <link rel="stylesheet" href="css/amazeui.css" />
    <link rel="stylesheet" href="css/common.min.css" />
    <link rel="stylesheet" href="css/index.min.css" />--%>
    <section class="breadcrumb breadcrumb_bg" style="background-image: url(static/image/breadcrumb-bg.png);">
			<div class="container h-100">
				<div class="row h-100 align-items-center">
					<div class="col-12">
						<div class="breadcrumb_iner">
							<div class="breadcrumb_iner_item text-center">
								<h2 id="h2_name"></h2>
                                 <div class="custom-breadcrumb">
									<ol class="breadcrumb d-inline-block bg-transparent list-inline py-0">
										<li class="list-inline-item breadcrumb-item">
											<a href="#">PRODUITS</a>
										</li>
										<li class="list-inline-item breadcrumb-item active" id="top_name">
                                        </li>
                                        <li class="list-inline-item breadcrumb-item active" id="second_name"></li>
									</ol>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <div class="product-details-area pt-100 pb-100">
        <div class="container">
            <div class="row">
                <div class="col-lg-6 mb-md-30 mb-sm-25">
                    <div class="product-details-left">
                        <div class="product-details-images slider-lg-image-1" id="div_img">
                            <div class="lg-image" id="div_lg_img_1">
                                <img id="img_1" src="" alt="" style="min-height: 200px; max-height: 500px; object-fit: cover" />
                                <a id="a_1" href="" class="popup-img venobox" data-gall="myGallery"><i class="las la-expand">
                                </i></a>
                            </div>
                            <div class="lg-image" id="div_lg_img_2">
                                <img id="img_2" src="" alt="" style="min-height: 200px; max-height: 500px; object-fit: cover" />
                                <a id="a_2" href="" class="popup-img venobox" data-gall="myGallery"><i class="las la-expand">
                                </i></a>
                            </div>
                            <div class="lg-image" id="div_lg_img_3">
                                <img id="img_3" src="" alt="" style="min-height: 200px; max-height: 500px; object-fit: cover" />
                                <a id="a_3" href="" class="popup-img venobox" data-gall="myGallery"><i class="las la-expand">
                                </i></a>
                            </div>
                            <div class="lg-image" id="div_lg_img_4">
                                <img id="img_4" src="" alt="" style="min-height: 200px; max-height: 500px; object-fit: cover" />
                                <a id="a_4" href="" class="popup-img venobox" data-gall="myGallery"><i class="las la-expand">
                                </i></a>
                            </div>
                            <div class="lg-image" id="div_lg_img_5">
                                <img id="img_5" src="" alt="" style="min-height: 200px; max-height: 500px; object-fit: cover" />
                                <a id="a_5" href="" class="popup-img venobox" data-gall="myGallery"><i class="las la-expand">
                                </i></a>
                            </div>
                        </div>
                        <div class="product-details-thumbs slider-thumbs-1" id="div_imgTwo">
                            <div class="sm-image" id="div_sm_img_1">
                                <img id="img_sm_1" src="" style="width: inherit; max-height: 150px; object-fit: cover" />
                            </div>
                            <div class="sm-image" id="div_sm_img_2">
                                <img id="img_sm_2" src="" style="width: inherit; max-height: 150px; object-fit: cover" />
                            </div>
                            <div class="sm-image" id="div_sm_img_3">
                                <img id="img_sm_3" src="" style="width: inherit; max-height: 150px; object-fit: cover" />
                            </div>
                            <div class="sm-image" id="div_sm_img_4">
                                <img id="img_sm_4" src="" style="width: inherit; max-height: 150px; object-fit: cover" />
                            </div>
                            <div class="sm-image" id="div_sm_img_5">
                                <img id="img_sm_5" src="" style="width: inherit; max-height: 150px; object-fit: cover" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="product-detail-content">
                        <div class="tags mb-5">
                            <span class="tag-title" id="span_subName"></span>
                            <%--<ul class="tag-list">
									<li>
										<a href="#">Plant</a>,
									</li>
									<li>
										<a href="#">Garden</a>
									</li>
								</ul>--%>
                        </div>
                        <h3 class="product-details-title mb-15" id="title_Name">
                            Lorem ipsum indoor plants</h3>
                        <p class="product-price product-price--big mb-10">
                            <span class="discounted-price" id="span_ref"></span>
                            <%--<span class="main-price discounted">$120.00</span>--%>
                            <%--  这里显示产品型号--%>
                        </p>
                        <div class="size mb-20">
                            <span class="title">Temperature de couleur:</span>
                            <br>
                            <select name="chooseSize" id="select_couleur" class="nice-select" style="width: 200px">
                            </select>
                            <span class="title">Puissance:</span>
                            <br>
                            <select name="chooseSize" id="select_puissance" class="nice-select">
                            </select>
                            <span class="title">Type de driver:</span>
                            <br>
                            <select name="chooseSize" id="select_driver" class="nice-select">
                            </select>
                            <span class="quantity-title mr-20">Qty:</span>
                            <div class="pro-details-quality mb-4">
                                <div class="cart-plus-minus">
                                    <input class="cart-plus-minus-box plus-minus-width-inc" id="qty" type="text" name="qtybutton"
                                        value="1">
                                </div>
                            </div>
                            <div id="div_btn">
                                <a href="#" class="btn theme-btn mr-4 mb-2"><i class="las la-shopping-cart mr-2"></i>
                                    Buy Now </a><a href="#" class="btn theme-btn mr-4 mb-2"><i class="las la-plus mr-2">
                                    </i>Add to Cart </a>
                            </div>
                           
                        </div>
                        <div class="wishlist-button d-inline-block" id="div_wishlist">
                        </div>
                        <div class="product-details-feature-wrapper d-flex justify-content-start mt-20">
                            <div class="single-icon-feature pl-50">
                                <div class="single-icon-feature__icon">
                                    <img src="static/picture/free-shipping.png" class="img-fluid" alt="">
                                </div>
                                <div class="single-icon-feature__content">
                                    <p class="feature-text">
                                        Free Shipping</p>
                                    <p class="feature-text">
                                        Ships Today</p>
                                </div>
                            </div>
                            <div class="single-icon-feature pl-50 ml-30 ml-xs-0 ml-xxs-0">
                                <div class="single-icon-feature__icon">
                                    <img src="static/picture/easy-return.png" class="img-fluid" alt="">
                                </div>
                                <div class="single-icon-feature__content">
                                    <p class="feature-text">
                                        Easy</p>
                                    <p class="feature-text">
                                        Returns</p>
                                </div>
                            </div>
                            <div class="single-icon-feature pl-50 ml-30 ml-xs-0 ml-xxs-0">
                                <div class="single-icon-feature__icon">
                                    <img src="static/picture/lower-price.png" class="img-fluid" alt="">
                                </div>
                                <div class="single-icon-feature__content">
                                    <p class="feature-text">
                                        Lowest Price</p>
                                    <p class="feature-text">
                                        Guarantee</p>
                                </div>
                            </div>
                        </div>
                        <div class="social-share-buttons mt-20">
                            <h3>
                                share this product</h3>
                            <ul>
                                <li><a href="#"><i class="lab la-facebook-f"></i></a></li>
                                <li><a href="#"><i class="lab la-twitter"></i></a></li>
                                <li><a href="#"><i class="lab la-instagram"></i></a></li>
                                <li><a href="#"><i class="lab la-youtube"></i></a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <section class="description pb-110">
			<div class="container">
				<div class="row">
					<div class="col-lg-12">
						<div class="dec-review-topbar nav mb-45">
							<a class="active" data-toggle="tab" href="#des-details1" onclick="click_d()" id="tab_d">Description</a>
							<a data-toggle="tab" href="#des-details2" onclick="click_s()" id="tab_s">Specification</a>
                            <a data-toggle="tab" href="#des-details2" onclick="click_t()" id="tab_t">Download TechSheet</a>
                            <a data-toggle="tab" href="#des-details2" onclick="click_i()" id="tab_i">Download IES</a>
						</div>
						<div class="tab-content dec-review-bottom">
							<div id="des-details1" class="tab-pane active">
								<div class="description-wrap" id="div_description">
								</div>
							</div>
							<div id="des-details2" class="tab-pane">
								<div class="specification-wrap table-responsive">
									<table>
										<tbody id="tb_specification">
											
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
    <script src="js/Web/ProductDetail.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
